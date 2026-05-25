import rawCourseCatalog from "../db/reference-data/course-catalog.json";
import rawCourseCatalogOptions from "../db/reference-data/course-catalog-staging.json";

export type CourseCatalogOption = {
  crn: string;
  courseCode: string;
  courseTitle: string;
  department: string;
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: "lecturer" | "advisor";
  campus: string;
  section: string;
  source: string;
};

const courseCatalog = rawCourseCatalog as CourseCatalogOption[];
const stagingCourseCatalog = rawCourseCatalogOptions as CourseCatalogOption[];

export const courseCatalogOptions = [...courseCatalog, ...stagingCourseCatalog];
