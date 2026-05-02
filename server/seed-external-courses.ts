import { getDb } from "./db";

/**
 * Seed external courses with sample data
 */
export async function seedExternalCourses() {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check if courses already exist
    const existing = await db.execute(`SELECT COUNT(*) as count FROM external_courses`);
    const count = (existing[0] as any)?.count || 0;
    
    if (count > 0) {
      console.log("[Seed] External courses already exist, skipping seed");
      return true;
    }

    // Insert sample courses
    await db.execute(`
      INSERT INTO external_courses (
        title, slug, description, shortDescription, externalUrl, 
        source, level, duration, instructor, rating, requiresSubscription, isActive
      ) VALUES 
      (
        'Python for Data Science',
        'python-data-science',
        'Learn Python programming for data science applications with hands-on projects',
        'Master Python for data analysis',
        'https://www.udemy.com/course/python-for-data-science',
        'udemy',
        'intermediaire',
        40,
        'John Doe',
        4.5,
        true,
        true
      ),
      (
        'Web Development with React',
        'web-dev-react',
        'Complete guide to building modern web applications with React and TypeScript',
        'Build modern web apps with React',
        'https://www.coursera.org/learn/react',
        'coursera',
        'intermediaire',
        30,
        'Jane Smith',
        4.7,
        true,
        true
      ),
      (
        'Machine Learning Basics',
        'ml-basics',
        'Introduction to machine learning concepts, algorithms and practical implementations',
        'Get started with ML',
        'https://www.youtube.com/playlist?list=PLkDaJ6LfdBvq',
        'youtube',
        'debutant',
        25,
        'AI Expert',
        4.3,
        true,
        true
      ),
      (
        'Advanced JavaScript',
        'advanced-javascript',
        'Deep dive into JavaScript concepts, async programming, and modern frameworks',
        'Master advanced JavaScript',
        'https://www.udemy.com/course/advanced-javascript',
        'udemy',
        'avance',
        35,
        'Code Master',
        4.6,
        true,
        true
      ),
      (
        'Cloud Computing with AWS',
        'cloud-aws',
        'Learn AWS services, architecture, and best practices for cloud deployment',
        'Master AWS cloud services',
        'https://www.coursera.org/learn/aws',
        'coursera',
        'intermediaire',
        45,
        'Cloud Expert',
        4.4,
        true,
        true
      )
    `);

    console.log("[Seed] External courses seeded successfully");
    return true;
  } catch (error) {
    console.error("[Seed] Error seeding external courses:", error);
    return false;
  }
}
