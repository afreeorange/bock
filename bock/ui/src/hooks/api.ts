import axios from "axios";
import { useState, useEffect } from "react";

import { State } from "../types";

export type HookResponse<T> = {
  state: State;
  data: T | null;
};

const useAPI = <T>(endpoint: string): HookResponse<T> => {
  const [state, setState] = useState<State>("Idle");
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setState("Loading");

        const ret = (await axios.get(`${endpoint}`)).data;
        setData(ret as T);

        setState("Loaded");
      } catch (e) {
        setState("Error");
      }
    };

    fetch();
  }, [endpoint]);

  return {
    state,
    data,
  };
};

export default useAPI;
