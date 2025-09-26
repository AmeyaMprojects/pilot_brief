import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          {/* Liquid Glass Logo Design */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 liquid-gradient rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-2xl">☁️</span>
                <div className="absolute inset-0 bg-white/10 rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-purple-200 bg-clip-text text-transparent tracking-wider">
                What'sup,Sky?
              </h1>
              <div className="text-sm text-blue-200/70 font-light tracking-widest">
                Aviation Weather Intelligence
              </div>
            </div>
          </div>
          
          {/* Static accent elements */}
          <div className="absolute left-8 top-1/2 w-2 h-2 bg-blue-400/30 rounded-full"></div>
          <div className="absolute right-8 top-1/2 w-2 h-2 bg-purple-400/30 rounded-full"></div>
        </div>
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
    </header>
  );
};

export default Header;