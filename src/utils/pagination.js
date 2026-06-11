const getPagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

const buildPaginationResponse = ({ data, total, page, limit }) => {
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        }
    };
};

module.exports = {
    getPagination,
    buildPaginationResponse
};