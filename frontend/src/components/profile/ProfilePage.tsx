// src/components/profile/ProfilePage.tsx

import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { Loader2, Save } from "lucide-react";

const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(API_ENDPOINTS.profile, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProfile(await res.json());
  };

  useEffect(() => load(), []);

  const update = async () => {
    setSaving(true);

    const token = localStorage.getItem("token");

    await fetch(API_ENDPOINTS.profile, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    setSaving(false);
  };

  if (!profile)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-6 space-y-3 bg-white rounded-xl max-w-lg mx-auto">

      <h2 className="font-semibold text-lg">Profile</h2>

      <input
        className="w-full p-2 border rounded"
        value={profile.full_name}
        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
      />

      <input
        className="w-full p-2 border rounded"
        value={profile.phone || ""}
        placeholder="Phone"
        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
      />

      <input
        type="date"
        className="w-full p-2 border rounded"
        value={profile.date_of_birth || ""}
        onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
      />

      <input
        className="w-full p-2 border rounded"
        value={profile.occupation || ""}
        placeholder="Occupation"
        onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
      />

      <input
        type="number"
        className="w-full p-2 border rounded"
        value={profile.monthly_budget || ""}
        placeholder="Monthly Budget"
        onChange={(e) => setProfile({ ...profile, monthly_budget: e.target.value })}
      />

      <button
        onClick={update}
        disabled={saving}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        Save Changes
      </button>
    </div>
  );
};

export default ProfilePage;
