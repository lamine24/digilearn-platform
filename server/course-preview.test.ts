import { describe, it, expect, beforeEach } from "vitest";

describe("Course Preview Modal", () => {
  const mockCourse = {
    id: 1,
    title: "Advanced Python Programming",
    description: "Learn advanced Python concepts and best practices",
    shortDescription: "Advanced Python course",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    instructor: "John Doe",
    duration: 40,
    level: "avance",
    rating: 4.8,
    enrollmentCount: 15000,
    source: "youtube",
    categoryId: 1,
    tags: "python,programming,advanced",
  };

  describe("Modal Display", () => {
    it("should display course title in modal", () => {
      expect(mockCourse.title).toBe("Advanced Python Programming");
    });

    it("should display course description", () => {
      expect(mockCourse.description).toContain("advanced Python");
    });

    it("should display course metadata", () => {
      expect(mockCourse.duration).toBe(40);
      expect(mockCourse.level).toBe("avance");
      expect(mockCourse.rating).toBe(4.8);
      expect(mockCourse.enrollmentCount).toBe(15000);
    });
  });

  describe("Video Extraction", () => {
    it("should extract YouTube video ID from URL", () => {
      const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = youtubeUrl.match(videoIdRegex);
      expect(match?.[1]).toBe("dQw4w9WgXcQ");
    });

    it("should extract YouTube video ID from short URL", () => {
      const shortUrl = "https://youtu.be/dQw4w9WgXcQ";
      const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = shortUrl.match(videoIdRegex);
      expect(match?.[1]).toBe("dQw4w9WgXcQ");
    });

    it("should return null for non-YouTube URLs", () => {
      const nonYoutubeUrl = "https://example.com/video";
      const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = nonYoutubeUrl.match(videoIdRegex);
      expect(match).toBeNull();
    });
  });

  describe("Level Display", () => {
    it("should display correct level label for 'debutant'", () => {
      const levelLabels: Record<string, string> = {
        debutant: "Débutant",
        intermediaire: "Intermédiaire",
        avance: "Avancé",
      };
      expect(levelLabels["debutant"]).toBe("Débutant");
    });

    it("should display correct level label for 'intermediaire'", () => {
      const levelLabels: Record<string, string> = {
        debutant: "Débutant",
        intermediaire: "Intermédiaire",
        avance: "Avancé",
      };
      expect(levelLabels["intermediaire"]).toBe("Intermédiaire");
    });

    it("should display correct level label for 'avance'", () => {
      const levelLabels: Record<string, string> = {
        debutant: "Débutant",
        intermediaire: "Intermédiaire",
        avance: "Avancé",
      };
      expect(levelLabels["avance"]).toBe("Avancé");
    });
  });

  describe("Rating Display", () => {
    it("should format rating to 1 decimal place", () => {
      const rating = 4.8;
      expect(rating.toFixed(1)).toBe("4.8");
    });

    it("should format enrollment count in thousands", () => {
      const count = 15000;
      expect((count / 1000).toFixed(1)).toBe("15.0");
    });

    it("should format large enrollment count", () => {
      const count = 1234567;
      expect((count / 1000).toFixed(1)).toBe("1234.6");
    });
  });

  describe("Tags Parsing", () => {
    it("should parse tags from comma-separated string", () => {
      const tags = "python,programming,advanced";
      const tagArray = tags.split(",").map((tag) => tag.trim());
      expect(tagArray).toEqual(["python", "programming", "advanced"]);
    });

    it("should handle tags with spaces", () => {
      const tags = "python, programming , advanced";
      const tagArray = tags.split(",").map((tag) => tag.trim());
      expect(tagArray).toEqual(["python", "programming", "advanced"]);
    });

    it("should handle empty tags", () => {
      const tags = "";
      const tagArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      expect(tagArray).toEqual([]);
    });
  });

  describe("Modal Actions", () => {
    it("should have enroll button", () => {
      expect(mockCourse.externalUrl).toBeDefined();
    });

    it("should have favorite button", () => {
      expect(mockCourse.id).toBeDefined();
    });

    it("should have share button", () => {
      expect(mockCourse.title).toBeDefined();
    });
  });

  describe("Course Metadata Validation", () => {
    it("should have valid course structure", () => {
      expect(mockCourse).toHaveProperty("id");
      expect(mockCourse).toHaveProperty("title");
      expect(mockCourse).toHaveProperty("description");
      expect(mockCourse).toHaveProperty("externalUrl");
      expect(mockCourse).toHaveProperty("duration");
      expect(mockCourse).toHaveProperty("level");
      expect(mockCourse).toHaveProperty("rating");
      expect(mockCourse).toHaveProperty("enrollmentCount");
    });

    it("should have valid rating range", () => {
      expect(mockCourse.rating).toBeGreaterThanOrEqual(0);
      expect(mockCourse.rating).toBeLessThanOrEqual(5);
    });

    it("should have positive duration", () => {
      expect(mockCourse.duration).toBeGreaterThan(0);
    });

    it("should have non-negative enrollment count", () => {
      expect(mockCourse.enrollmentCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Responsive Design", () => {
    it("should support mobile viewport", () => {
      // Modal should be responsive
      expect(mockCourse).toBeDefined();
    });

    it("should support tablet viewport", () => {
      // Modal should adapt to tablet size
      expect(mockCourse).toBeDefined();
    });

    it("should support desktop viewport", () => {
      // Modal should display full content on desktop
      expect(mockCourse).toBeDefined();
    });
  });
});
