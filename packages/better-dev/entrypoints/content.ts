export default defineContentScript({
  matches: ["*://localhost:3000/*"],
  main() {
    console.log("Hello content.");
  },
});
