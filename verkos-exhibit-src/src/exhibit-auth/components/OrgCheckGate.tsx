/** EXHIBIT SHIM — org checks are inert; render children straight through. */
import React from 'react';
export default function OrgCheckGate({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
