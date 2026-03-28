export function urlWithQueryParams(url: string, queryParams: { name: string; value: string }[]) {
  let urlWithParams = url;
  queryParams.forEach(({ name, value }, i) => {
    const isFirstParam = i === 0;
    if (isFirstParam) {
      urlWithParams += "?";
    } else {
      urlWithParams += "&";
    }

    urlWithParams += `${name}=${encodeURIComponent(value)}`;
  });
  return urlWithParams;
}
