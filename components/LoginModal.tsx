'use client';
import React from 'react';
import { X } from 'lucide-react';
import { getCasdoorSdk } from '@/lib/casdoor';

const LoginModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLogin = () => {
    // Get the signin URL and redirect
    const signinUrl = getCasdoorSdk().getSigninUrl();
    window.location.href = signinUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="flex flex-col space-y-4 text-center">
          <h2 className="text-lg font-semibold">Login Required</h2>
          <p className="text-sm text-muted-foreground">
            You need to be logged in to draw on the board.
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          >
            Login with GeekPie_ Uni-Auth
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
