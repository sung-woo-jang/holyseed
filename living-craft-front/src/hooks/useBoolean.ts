import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

type UseBooleanReturn = {
  value: boolean;
  setValue: Dispatch<SetStateAction<boolean>>;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
};

export function useBoolean(defaultValue = false): UseBooleanReturn {
  const [value, setValue] = useState(defaultValue);

  const setTrue = () => {
    setValue(true);
  };

  const setFalse = () => {
    setValue(false);
  };

  const toggle = () => {
    setValue((x) => !x);
  };

  return { value, setValue, setTrue, setFalse, toggle };
}
