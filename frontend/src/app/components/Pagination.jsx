import { Fragment } from "react";

const Pagination = ({ tableData, page, searchParams, router }) => {
  const totalPages = tableData.total_page_cnt;
  const currentPage = page;
  const maxVisiblePages = 5; // Adjust this number to control how many pages are visible

  const renderPageNumbers = () => {
    const pages = [];
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are fewer than maxVisiblePages
      startPage = 1;
      endPage = totalPages;
    } else {
      // Calculate start and end pages based on current page
      if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage + Math.floor(maxVisiblePages / 2) >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxVisiblePages / 2);
        endPage = currentPage + Math.floor(maxVisiblePages / 2);
      }
    }

    // Add the first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(
        <p
          key={1}
          className="text-[#D0D0D0] font-semibold px-2 rounded-sm cursor-pointer"
          onClick={() => handlePageClick(0)}
        >
          1
        </p>
      );
      if (startPage > 2) {
        pages.push(
          <span className="text-[#D0D0D0]" key="ellipsis-start">
            ...
          </span>
        );
      }
    }

    // Add the visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <p
          key={i}
          className={`${
            currentPage === i - 1
              ? "text-black bg-[var(--primary-color)]"
              : "text-[#D0D0D0]"
          } font-semibold px-2 rounded-sm cursor-pointer`}
          onClick={() => handlePageClick(i - 1)}
        >
          {i}
        </p>
      );
    }

    // Add the last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span className="text-[#D0D0D0]" key="ellipsis-end">
            ...
          </span>
        );
      }
      pages.push(
        <p
          key={totalPages}
          className="text-[#D0D0D0] font-semibold px-2 rounded-sm cursor-pointer"
          onClick={() => handlePageClick(totalPages - 1)}
        >
          {totalPages}
        </p>
      );
    }

    return pages;
  };

  const handlePageClick = (pageIndex) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", pageIndex.toString());
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  return <div className="flex gap-5">{renderPageNumbers()}</div>;
};

export default Pagination;
