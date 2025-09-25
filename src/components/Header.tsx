import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-background border-b border-border">
      <div className="flex items-center">
        {/* Minimalist Logo: Abstract wing with cloud or just text */}
        <span className="text-white text-2xl font-bold tracking-wide">AI MetBrief</span>
      </div>
      <nav>
        <a href="#" className="text-foreground hover:text-primary transition-colors text-lg">About</a>
      </nav>
    </header>
  );
};

export default Header;