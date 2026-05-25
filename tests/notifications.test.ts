import { mkdtemp } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SubmissionRecord } from "../lib/types";

const baseSubmission: SubmissionRecord = {
  id: "sub-001",
  formType: "course-override",
  status: "pending_advisor_review",
  student: {
    studentId: "00012345",
    firstName: "Asha",
    lastName: "Student",
    email: "asha.student@costaatt.edu.tt",
    roles: ["student"]
  },
  payload: {
    formType: "course-override",
    requestType: "Override Pre-requisite",
    academicYear: "2026/2027",
    semester: "Semester 1",
    programme: "Information Technology",
    degree: "Associate Degree",
    advisorName: "Alex Lecturer",
    courses: [{ crn: "12345", courseCode: "COMP 101", courseTitle: "Introduction to Computing" }],
    declarations: []
  },
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z"
};

async function prepareStore() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "costaatt-notifications-"));
  process.env.NOTIFICATION_STORE_PATH = path.join(dir, "notifications.json");
}

afterEach(() => {
  vi.resetModules();
  delete process.env.NOTIFICATION_STORE_PATH;
});

describe("student notifications", () => {
  it("creates and lists student notifications from local JSON fallback", async () => {
    await prepareStore();
    const { listStudentNotifications, notifySubmissionCreated, unreadStudentNotificationCount } = await import("../lib/notifications");

    await notifySubmissionCreated(baseSubmission);

    const notifications = await listStudentNotifications("00012345");
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      studentId: "00012345",
      submissionId: "sub-001",
      type: "submission_created"
    });
    expect(await unreadStudentNotificationCount("00012345")).toBe(1);
    expect(await listStudentNotifications("OTHER")).toHaveLength(0);
  });

  it("marks one or all notifications read for only the signed-in student", async () => {
    await prepareStore();
    const {
      createStudentNotification,
      listStudentNotifications,
      markAllStudentNotificationsRead,
      markStudentNotificationRead,
      unreadStudentNotificationCount
    } = await import("../lib/notifications");

    const own = await createStudentNotification({
      studentId: "00012345",
      submissionId: "sub-001",
      type: "registry_status_changed",
      title: "Registry update",
      message: "Updated"
    });
    await createStudentNotification({
      studentId: "OTHER",
      submissionId: "sub-002",
      type: "registry_status_changed",
      title: "Other update",
      message: "Updated"
    });

    const missing = await markStudentNotificationRead("OTHER", own.id);
    expect(missing).toBeNull();
    const read = await markStudentNotificationRead("00012345", own.id);
    expect(read?.readAt).toBeTruthy();
    expect(await unreadStudentNotificationCount("00012345")).toBe(0);

    await createStudentNotification({
      studentId: "00012345",
      submissionId: "sub-003",
      type: "reviewer_approved",
      title: "Reviewer update",
      message: "Approved"
    });
    expect(await markAllStudentNotificationsRead("00012345")).toBe(1);
    expect((await listStudentNotifications("OTHER")).filter((item) => !item.readAt)).toHaveLength(1);
  });

  it("creates reviewer and Registry status notifications", async () => {
    await prepareStore();
    const { listStudentNotifications, notifyRegistryStatusChange, notifyReviewerAction } = await import("../lib/notifications");

    await notifyReviewerAction(baseSubmission, "needs_information");
    await notifyRegistryStatusChange({ ...baseSubmission, status: "registry_approved" });

    const notifications = await listStudentNotifications("00012345");
    expect(notifications.map((item) => item.type)).toEqual(["registry_approved", "reviewer_needs_information"]);
  });
});
