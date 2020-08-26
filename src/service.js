export const GRPC_ADDR = process.env.GRPC_ADDR
  ? process.env.GRPC_ADDR
  : "http://localhost:3001";

export const RESULT_ADDR = process.env.RESULT_ADDR
  ? process.env.RESULT_ADDR
  : "http://localhost:3002";

export const downloadSchemeFile = (id) => {
  window.open(`${RESULT_ADDR}/result_file/${id}`);
};

export const downloadCSVfiles = (id) => {
  window.open(`${RESULT_ADDR}/csv/${id}`);
};

export const downloadCSVFile = (id, annotation) => {
  window.open(
    `${RESULT_ADDR}/csv_file/${id}/${annotation.substr(
      0,
      annotation.length - 4
    )}`
  );
};

export const capitalizeFirstLetter = (string) => {
  return string[0].toUpperCase() + string.slice(1);
};
