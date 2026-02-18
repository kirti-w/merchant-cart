import * as cartDB from "./cartModule.js";

let result;

result = await cartDB.searchProducts({ searchTerm: "^Wireless" });
console.log("Search Result:", result);

result = await cartDB.searchProducts({ searchTerm: "bluetooth" });
console.log("Search Result:", result);

result = await cartDB.searchProducts({ searchTerm: "" });
console.log("Search Result:", result);

result = await cartDB.findOrdersByCustId("u002");
result = JSON.stringify(result, null, 2);
console.log("Orders for Customer u002:", result);

result = await cartDB.findOrdersByCustId("u003");
result = JSON.stringify(result, null, 2);
console.log("Orders for Customer u003:", result);
