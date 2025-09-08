import React from 'react';

interface ImagePickerSimpleProps {
  shootId: string;
  previewSettings: {
    id: string;
    selectionLimit: number;
  };
  userEmail: string;
}

export function ImagePickerSimple({ shootId, previewSettings, userEmail }: ImagePickerSimpleProps) {
  return (
    <div className="p-4">
      <h3 className="text-white text-xl mb-4">Image Selection (Debug Mode)</h3>
      <div className="bg-gray-800 p-4 rounded">
        <p className="text-white">Shoot ID: {shootId}</p>
        <p className="text-white">User Email: {userEmail}</p>
        <p className="text-white">Selection Limit: {previewSettings.selectionLimit}</p>
        <p className="text-green-400">Component loaded successfully without infinite loop!</p>
      </div>
    </div>
  );
}