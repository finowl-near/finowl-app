"use client";

import React, { useState } from "react";
import TableHead from "./TableHead";
import TableBody from "./TableBody";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getTableData from "../api/getTableData";
import useTableData from "../hooks/useTableData";

export default function Table() {
    const setTableData = useTableData((state) => state.setTableData);
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: ["tableData"], queryFn: async () => {
        const data = await getTableData();
        console.log('data', data);
        setTableData(data);
        return data;
    } })
  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute top-2 right-1/2 translate-x-1/2 w-1/2 h-10 bg-[#D8E864] -z-10 rounded-[50px_50px_100px_100px] blur-2xl opacity-50"></div>
        <div className="w-full max-h-[700px] rounded-[20px] border border-[#292929] max-w-[1400px] overflow-auto">
          <table className="w-full ">
            <TableHead />
            <TableBody />
          </table>
        </div>
      </div>
      <div className="p-4 flex justify-center gap-10">
        <div className="flex cursor-pointer">
            <ChevronLeftIcon className="w-4" color="#D8E864"/>
            <p className="text-[#D0D0D0]">Previous</p>
        </div>
        <div className="flex gap-5">
            <p className="text-black font-semibold px-2 rounded-sm bg-[#D8E864]">1</p>
            <p className="text-[#D0D0D0] font-semibold">2</p>
            <p className="text-[#D0D0D0] font-semibold">3</p>
            <p className="text-[#D0D0D0] font-semibold">4</p>
        </div>
        <div className="flex cursor-pointer">
            <p className="text-[#D0D0D0]">Next</p>
            <ChevronRightIcon className="w-4" color="#D8E864"/>
        </div>
      </div>
    </div>
  );
}
