"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatDateTime } from "@/lib/display";
import type { StudentNotification } from "@/lib/types";

export default function StudentNotifications({ initialNotifications }: { initialNotifications: StudentNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.readAt).length, [notifications]);

  async function markOne(id: string) {
    const response = await fetch(`/api/notifications/me/${id}`, { method: "PATCH" });
    if (!response.ok) return;
    const result = await response.json();
    setNotifications((items) => items.map((item) => item.id === id ? result.notification : item));
  }

  async function markAll() {
    const response = await fetch("/api/notifications/me", { method: "PATCH" });
    if (!response.ok) return;
    const readAt = new Date().toISOString();
    setNotifications((items) => items.map((item) => item.readAt ? item : { ...item, readAt }));
  }

  return (
    <section className="notification-shell">
      <div className="notification-toolbar">
        <div>
          <p className="eyeline">Student notifications</p>
          <h2>{unreadCount} unread update{unreadCount === 1 ? "" : "s"}</h2>
        </div>
        <button className="secondary-button" disabled={unreadCount === 0} onClick={markAll} type="button">
          <CheckCheck size={17} /> Mark all as read
        </button>
      </div>

      <div className="notification-list">
        {notifications.map((notification) => (
          <article className={`notification-card ${notification.readAt ? "" : "notification-unread"}`} key={notification.id}>
            <div className="card-icon"><Bell size={18} /></div>
            <div>
              <div className="notification-card-head">
                <h3>{notification.title}</h3>
                {!notification.readAt ? <span className="status-pill">Unread</span> : null}
              </div>
              <p>{notification.message}</p>
              <small>{formatDateTime(notification.createdAt)}</small>
              <div className="row-actions">
                <Link href={`/student/dashboard/${notification.submissionId}`}>Open request</Link>
                {!notification.readAt ? (
                  <button className="link-button" onClick={() => markOne(notification.id)} type="button">Mark as read</button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {notifications.length === 0 ? <p className="empty-state">No notifications yet.</p> : null}
      </div>
    </section>
  );
}
