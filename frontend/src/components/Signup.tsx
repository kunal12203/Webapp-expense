// src/components/Signup.tsx

import React from "react";
import SignupForm from "./onboarding/SignupForm";

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
        <h1 className="text-xl font-semibold mb-4">Create Account</h1>
        <SignupForm onSignupSuccess={() => {}} />
      </div>
    </div>
  );
};

export default Signup;
