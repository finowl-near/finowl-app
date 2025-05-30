import axios from "axios";

export default async function getTableData(page) {
    console.log("inside page", page)
    const response = await axios.get(`https://finowl.finance/api/v0/generic-discovery?sort=mindshare&sortDir=desc`);
    if (response.status === 200) {
        return response.data;
    }
    return null;
}