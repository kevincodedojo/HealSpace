import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

// ============================================
// Mock mysql2/promise BEFORE importing the app
// ============================================
const mockQuery = jest.fn();
const mockPool = {
  query: mockQuery,
  end: jest.fn(),
};

jest.unstable_mockModule('mysql2/promise', () => ({
  default: { createPool: () => mockPool },
  createPool: () => mockPool,
}));

// Import after mocking
const { default: supertest } = await import('supertest');
const { default: bcrypt } = await import('bcrypt');
const { app } = await import('../index.mjs');

const request = supertest(app);

// Pre-compute a bcrypt hash for "password123" (used by multiple tests)
const TEST_PASSWORD = 'password123';
const TEST_HASH = await bcrypt.hash(TEST_PASSWORD, 10);

const TEST_USER = {
  id: 1,
  email: 'test@example.com',
  password_hash: TEST_HASH,
  first_name: 'Test',
  last_name: 'User',
  role: 'patient',
};

// ============================================
// Helper: create a logged-in agent
// ============================================
async function loginAgent() {
  const agent = supertest.agent(app);

  // Mock the DB query that finds the user by email
  mockQuery.mockResolvedValueOnce([[{ ...TEST_USER }]]);

  await agent
    .post('/login')
    .type('form')
    .send({ email: TEST_USER.email, password: TEST_PASSWORD });

  return agent;
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  mockQuery.mockReset();
});

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------
describe('Public Routes', () => {

  describe('GET / (Home)', () => {
    it('should return 200 and render categories', async () => {
      mockQuery.mockResolvedValueOnce([[
        { id: 1, name: 'Art Therapy', description: 'Creative expression', image_url: '/img/categories/art_therapy.png' },
        { id: 2, name: 'Music Therapy', description: 'Healing through music', image_url: '/img/categories/music_therapy.png' },
      ]]);

      const res = await request.get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Art Therapy');
      expect(res.text).toContain('Music Therapy');
    });

    it('should return 500 when database fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await request.get('/');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /programs (All Programs)', () => {
    it('should return 200 and list all programs', async () => {
      mockQuery.mockResolvedValueOnce([[
        { id: 1, title: 'Watercolor Painting Class', category_name: 'Art Therapy', description: 'Learn watercolor', duration_mins: 45, location: 'Art Room', capacity: 10, image_url: '/img/programs/Watercolor_Painting_Class.png', is_active: true },
        { id: 2, title: 'Sound Bath', category_name: 'Music Therapy', description: 'Singing bowls', duration_mins: 40, location: 'Meditation Room', capacity: 12, image_url: '/img/programs/Sound_Bath.png', is_active: true },
      ]]);

      const res = await request.get('/programs');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Watercolor Painting Class');
      expect(res.text).toContain('Sound Bath');
    });
  });

  describe('GET /programs/category/:id', () => {
    it('should return programs filtered by category', async () => {
      // First query: get category
      mockQuery.mockResolvedValueOnce([[
        { id: 1, name: 'Art Therapy', description: 'Creative expression', image_url: '/img/categories/art_therapy.png' },
      ]]);
      // Second query: get programs in category
      mockQuery.mockResolvedValueOnce([[
        { id: 1, title: 'Watercolor Painting Class', category_name: 'Art Therapy', description: 'Watercolor', duration_mins: 45, location: 'Art Room', capacity: 10, image_url: '/img/programs/Watercolor_Painting_Class.png', is_active: true },
      ]]);

      const res = await request.get('/programs/category/1');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Watercolor Painting Class');
    });

    it('should return 404 for non-existent category', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const res = await request.get('/programs/category/999');
      expect(res.status).toBe(404);
    });
  });
});

// ------------------------------------------
// AUTH ROUTES
// ------------------------------------------
describe('Authentication Routes', () => {

  describe('GET /login', () => {
    it('should return 200 with login form', async () => {
      const res = await request.get('/login');
      expect(res.status).toBe(200);
      expect(res.text).toContain('login');
    });
  });

  describe('POST /login', () => {
    it('should redirect to /my-bookings on successful login', async () => {
      mockQuery.mockResolvedValueOnce([[{ ...TEST_USER }]]);

      const res = await request
        .post('/login')
        .type('form')
        .send({ email: 'test@example.com', password: TEST_PASSWORD })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/my-bookings');
    });

    it('should redirect back to /login with error for wrong password', async () => {
      mockQuery.mockResolvedValueOnce([[{ ...TEST_USER }]]);

      const res = await request
        .post('/login')
        .type('form')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/login?error=');
    });

    it('should redirect back to /login when user not found', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const res = await request
        .post('/login')
        .type('form')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/login?error=');
    });
  });

  describe('GET /register', () => {
    it('should return 200 with registration form', async () => {
      const res = await request.get('/register');
      expect(res.status).toBe(200);
      expect(res.text).toContain('register');
    });
  });

  describe('POST /register', () => {
    it('should redirect to success page on valid registration', async () => {
      // Check existing user — none found
      mockQuery.mockResolvedValueOnce([[]]);
      // Insert user
      mockQuery.mockResolvedValueOnce([{ insertId: 2 }]);

      const res = await request
        .post('/register')
        .type('form')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          password: 'securepass123',
          password_confirm: 'securepass123',
          birthday: '1990-05-15',
          room_number: '101A',
        })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/register-success');
    });

    it('should redirect back when passwords do not match', async () => {
      const res = await request
        .post('/register')
        .type('form')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          password: 'password1',
          password_confirm: 'password2',
        })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/register?error=');
    });

    it('should redirect back when email is already registered', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1 }]]); // existing user found

      const res = await request
        .post('/register')
        .type('form')
        .send({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'existing@example.com',
          password: 'securepass123',
          password_confirm: 'securepass123',
        })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/register?error=');
    });
  });
});

// ------------------------------------------
// PROTECTED ROUTES (require login)
// ------------------------------------------
describe('Protected Routes', () => {

  describe('when NOT logged in', () => {
    it('GET /my-bookings should redirect to /login', async () => {
      const res = await request.get('/my-bookings').redirects(0);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('GET /my-profile should redirect to /login', async () => {
      const res = await request.get('/my-profile').redirects(0);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('GET /book/1 should redirect to /login', async () => {
      const res = await request.get('/book/1').redirects(0);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('when logged in', () => {
    it('GET /my-bookings should return 200', async () => {
      const agent = await loginAgent();
      mockQuery.mockResolvedValueOnce([[]]);  // empty bookings

      const res = await agent.get('/my-bookings');
      expect(res.status).toBe(200);
    });

    it('GET /my-profile should return 200 with user data', async () => {
      const agent = await loginAgent();
      mockQuery.mockResolvedValueOnce([[{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        birthday: '1990-01-01',
        room_number: '302A',
        phone: '555-123-4567',
      }]]);

      const res = await agent.get('/my-profile');
      expect(res.status).toBe(200);
      expect(res.text).toContain('test@example.com');
    });

    it('POST /my-profile should update profile and redirect', async () => {
      const agent = await loginAgent();
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

      const res = await agent
        .post('/my-profile')
        .type('form')
        .send({
          first_name: 'Updated',
          last_name: 'Name',
          birthday: '1990-01-01',
          room_number: '401B',
          phone: '555-000-0000',
        })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/my-profile?success=');
    });
  });
});

// ------------------------------------------
// BOOKING FLOW
// ------------------------------------------
describe('Booking Flow', () => {

  describe('GET /book/:programId', () => {
    it('should show booking page with program info', async () => {
      const agent = await loginAgent();

      // Query 1: get program
      mockQuery.mockResolvedValueOnce([[{
        id: 1,
        title: 'Watercolor Painting Class',
        description: 'Learn watercolor',
        category_name: 'Art Therapy',
        duration_mins: 45,
        location: 'Art Room 203',
        capacity: 10,
        image_url: '/img/programs/Watercolor_Painting_Class.png',
        is_active: true,
      }]]);
      // Query 2: get schedules for time slot generation (none, so it skips)
      mockQuery.mockResolvedValueOnce([[]]);
      // Query 3: get available dates
      mockQuery.mockResolvedValueOnce([[]]);
      // Query 4: get schedule display info
      mockQuery.mockResolvedValueOnce([[
        { day_of_week: 1, start_time: '10:00:00', end_time: '15:00:00' },
      ]]);

      const res = await agent.get('/book/1');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Watercolor Painting Class');
    });

    it('should return 404 for inactive program', async () => {
      const agent = await loginAgent();
      mockQuery.mockResolvedValueOnce([[]]); // no program found

      const res = await agent.get('/book/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /book', () => {
    it('should create a booking and redirect to my-bookings', async () => {
      const agent = await loginAgent();

      // Query 1: check slot exists
      mockQuery.mockResolvedValueOnce([[{
        id: 10,
        program_id: 1,
        date: '2025-03-15',
        start_time: '10:00:00',
        end_time: '10:45:00',
        spots_available: 5,
        is_cancelled: false,
        program_title: 'Watercolor Painting Class',
      }]]);
      // Query 2: check existing booking
      mockQuery.mockResolvedValueOnce([[]]);
      // Query 3: insert booking
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);
      // Query 4: update spots
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await agent
        .post('/book')
        .type('form')
        .send({ time_slot_id: 10, program_id: 1 })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/my-bookings?success=');
    });

    it('should reject booking when slot is full', async () => {
      const agent = await loginAgent();

      mockQuery.mockResolvedValueOnce([[{
        id: 10,
        program_id: 1,
        spots_available: 0,
        is_cancelled: false,
        program_title: 'Watercolor Painting Class',
      }]]);

      const res = await agent
        .post('/book')
        .type('form')
        .send({ time_slot_id: 10, program_id: 1 })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('error=');
    });

    it('should reject duplicate booking for same slot', async () => {
      const agent = await loginAgent();

      mockQuery.mockResolvedValueOnce([[{
        id: 10,
        program_id: 1,
        spots_available: 5,
        is_cancelled: false,
        program_title: 'Watercolor Painting Class',
      }]]);
      // Existing booking found
      mockQuery.mockResolvedValueOnce([[{ id: 99 }]]);

      const res = await agent
        .post('/book')
        .type('form')
        .send({ time_slot_id: 10, program_id: 1 })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('error=');
    });

    it('should redirect when no time slot selected', async () => {
      const agent = await loginAgent();

      const res = await agent
        .post('/book')
        .type('form')
        .send({ program_id: 1 })
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('error=');
    });
  });

  describe('POST /cancel-booking/:id', () => {
    it('should cancel booking and restore spot', async () => {
      const agent = await loginAgent();

      // Query: verify booking
      mockQuery.mockResolvedValueOnce([[{
        id: 1,
        user_id: 1,
        status: 'booked',
        spots_available: 4,
        slot_id: 10,
      }]]);
      // Query: update booking status
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Query: restore spot
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await agent
        .post('/cancel-booking/1')
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/my-bookings?success=');
    });

    it('should redirect with error when booking not found', async () => {
      const agent = await loginAgent();
      mockQuery.mockResolvedValueOnce([[]]);

      const res = await agent
        .post('/cancel-booking/999')
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/my-bookings?error=');
    });
  });
});

// ------------------------------------------
// API ENDPOINT
// ------------------------------------------
describe('API Routes', () => {
  describe('GET /api/time-slots/:programId', () => {
    it('should return available time slots as JSON', async () => {
      mockQuery.mockResolvedValueOnce([[
        { id: 1, start_time: '10:00:00', end_time: '10:45:00', spots_available: 8 },
        { id: 2, start_time: '10:45:00', end_time: '11:30:00', spots_available: 3 },
        { id: 3, start_time: '11:30:00', end_time: '12:15:00', spots_available: 0 },
      ]]);

      const res = await request.get('/api/time-slots/1?date=2025-03-15');

      expect(res.status).toBe(200);
      expect(res.body.slots).toHaveLength(3);
      expect(res.body.slots[0].is_available).toBe(true);
      expect(res.body.slots[0].start_time).toBe('10:00:00');
      expect(res.body.slots[2].is_available).toBe(false);
    });

    it('should return 400 when date is missing', async () => {
      const res = await request.get('/api/time-slots/1');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date is required');
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      const res = await request.get('/api/time-slots/1?date=2025-03-15');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Server error');
    });
  });
});

// ------------------------------------------
// LOGOUT
// ------------------------------------------
describe('Logout', () => {
  it('should destroy session and redirect to home', async () => {
    const agent = await loginAgent();

    const res = await agent.get('/logout').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  it('should not be able to access protected routes after logout', async () => {
    const agent = await loginAgent();

    // Logout
    await agent.get('/logout');

    // Try to access protected route
    const res = await agent.get('/my-bookings').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});

// ------------------------------------------
// BOOKINGS REDIRECT
// ------------------------------------------
describe('GET /bookings', () => {
  it('should render login prompt for unauthenticated users', async () => {
    const res = await request.get('/bookings');
    expect(res.status).toBe(200);
  });

  it('should redirect to /my-bookings for authenticated users', async () => {
    const agent = await loginAgent();

    const res = await agent.get('/bookings').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/my-bookings');
  });
});
