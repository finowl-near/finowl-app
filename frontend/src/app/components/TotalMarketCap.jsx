import React from 'react'

export default function TotalMarketCap() {
  return (
    <div  className='p-4 h-[fit-content] relative m-4 border border-[#292929] rounded-[10px] overflow-hidden'>
        <div className="absolute top-2 right-0 w-32 h-8 bg-[#D8E864] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
        <p className="text-xl font-bold text-white">Total market cap</p>
        <div className='flex items-baseline justify-between'>
            <p className='text-[3.5rem] text-[#D0D0D0] font-bold'>16.99B</p>
            <p className='text-[#D8E864] font-bold'>+39.71% 7D</p>
        </div>
    </div>
  )
}
