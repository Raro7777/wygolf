import { setDefaultResultOrder } from "node:dns";

if (typeof setDefaultResultOrder === "function") {
  setDefaultResultOrder("ipv4first");
}
