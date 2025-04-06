"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">任務清單</h1>
      <ul className="mt-4">
        {tasks.map((task, i) => (
          <li key={i} className="mb-2 border p-2 rounded">
            {task.title}｜{task.priority}｜
            {new Date(task.deadline).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
