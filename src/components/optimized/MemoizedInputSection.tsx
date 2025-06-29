import React, { memo } from 'react';
import { GenerationRequest } from '../../types';
import InputSection from '../InputSection';

interface MemoizedInputSectionProps {
  onGenerate: (request: GenerationRequest) => void;
  isLoading: boolean;
  error?: string;
}

const MemoizedInputSection = memo(function MemoizedInputSection(props: MemoizedInputSectionProps) {
  return <InputSection {...props} />;
}, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
  );
});

export default MemoizedInputSection;