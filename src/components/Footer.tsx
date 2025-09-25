import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center p-4 bg-background border-t border-border text-muted-foreground text-sm mt-8">
      <div className="mb-2 md:mb-0">
        © 2025 Name placeholder
      </div>
      <div className="text-center md:text-right">
        For informational purposes only. Not for official flight planning.
      </div>
    </footer>
  );
};

export default Footer;