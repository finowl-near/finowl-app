import axios from "axios";

export default async function getTableData(page) {
    console.log("inside page", page)
    const response = await axios.get(`http://localhost:8080/api/v0/tickers?page=${page}&pageSize=10&sort=last_mentioned&sortDir=desc`);
    if (response.status === 200) {
        return response.data;
    }
    return null;
}