"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "ALUMNI",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="text-gray-600">
          We sent a verification link to <strong>{form.email}</strong>.
          Click it to activate your account, then come back and log in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="fullName"
          placeholder="Full name"
          value={form.fullName}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border rounded px-3 py-2"
        >
          <option value="ALUMNI">Alumni</option>
          <option value="STAFF">Current Staff</option>
          <option value="FORMER_STAFF">Former Employee</option>
          <option value="FREQUENT_FLYER">Frequent Flyer</option>
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
}