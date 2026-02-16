import React from 'react';

/**
 * Example React component to demonstrate TSX support
 */
export const ExampleComponent: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
};
