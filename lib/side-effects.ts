export type PostCommitTask = {
  name: string;
  run: () => Promise<unknown>;
};

export async function runPostCommitTasks(tasks: PostCommitTask[]) {
  const results = await Promise.allSettled(tasks.map((task) => task.run()));
  results.forEach((result, index) => {
    if (result.status === "fulfilled") return;
    console.error(JSON.stringify({
      level: "error",
      event: "post_commit_task_failed",
      task: tasks[index]?.name || "unknown",
      error: result.reason instanceof Error ? result.reason.message : String(result.reason)
    }));
  });
  return results;
}
