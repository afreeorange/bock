const { REACT_APP_CI } = process.env;

export const APP_NAME = "bock";

export const APP_URI = "http://wiki.nikhil.io";

export const UPSTREAM_ENDPOINT = REACT_APP_CI ? "" : "http://localhost:8000";
