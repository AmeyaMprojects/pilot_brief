import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center p-4 bg-background border-b border-border">
      <div className="flex items-center">
        {/* Minimalist Logo: Abstract wing with cloud or just text */}
        <span className="text-white text-2xl font-bold tracking-wide">What'sup,Sky?</span>
      </div>
    </header>
  );
};

export default Header;