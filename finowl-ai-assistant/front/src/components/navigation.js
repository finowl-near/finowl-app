import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import NearLogo from '/public/near-logo.svg';

export const Navigation = () => {
  const [label, setLabel] = useState('Loading...');
  const { signedAccountId, signIn, signOut } = useWalletSelector();

  useEffect(() => {
    if (signedAccountId) {
      setLabel(`Logout ${signedAccountId}`);
    } else {
      setLabel('Login');
    }
  }, [signedAccountId]);

  const handleAuth = async () => {
    if (signedAccountId) {
      await signOut();
    } else {
      await signIn();
    }
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link href="/" passHref legacyBehavior>
          <Image priority src={NearLogo} alt="NEAR" width="30" height="24" className="d-inline-block align-text-top" />
        </Link>
        <div className="navbar-nav pt-1">
          <button 
            className="btn btn-secondary" 
            onClick={handleAuth}
          >
            {label}
          </button>
        </div>
      </div>
    </nav>
  );
};
