// we were using this to detect when google auth completed on the page that
// opened the window
//
// function handleGoogleSignInWindowMessage(event: any) {
//   if (event.origin !== "http://localhost:3000") return;
//   if (event.data.googleSignInResult) {
//     console.log("event.data.googleSignInResult: ", event.data.googleSignInResult);
//     setGoogleAuthLoading(false);
//   }
// }

// useEffect(() => {
//   window.addEventListener("message", handleGoogleSignInWindowMessage);
//   return () => {
//     window.removeEventListener("message", handleGoogleSignInWindowMessage);
//   };
// }, []);
//
// from the google oath callback page in the success response handler
//
// window.opener.postMessage({ googleSignInResult: "success" }, "*");
