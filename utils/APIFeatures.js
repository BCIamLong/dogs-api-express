const AppError = require("./AppError");

class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    //split option from url
    const queryOb = { ...this.queryStr };
    const options = ["fields", "sort", "page", "limit"];
    options.forEach((op) => delete queryOb[op]);

    //two consver the gte, lte,... operation to $gte, $lte,...
    let strOperators = JSON.stringify(queryOb);
    strOperators = strOperators.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );
    // const operators = ["gte", "lte", "lt", "gt"];
    // for (const key in queryOb) {
    //   const op = Object.keys(queryOb[key])[0];
    //   if (operators.includes(op)) {
    //     queryOb[key][`$${op}`] = queryOb[key][op];
    //     delete queryOb[key][op];
    //   }
    // }

    this.query = this.query.find(JSON.parse(strOperators));

    return this;
  }

  sort() {
    if (!this.queryStr.sort) this.query = this.query.sort("-createdAt");
    else {
      const sortQuery = this.queryStr.sort.replaceAll(",", " ");
      this.query = this.query.sort(sortQuery);
    }

    return this;
  }

  select() {
    if (!this.queryStr.fields) this.query = this.query.select("-createdAt");
    else {
      const selectQuery = this.queryStr.fields.replaceAll(",", " ");
      this.query = this.query.select(selectQuery);
    }

    return this;
  }

  pagination(count) {
    const page = +this.queryStr.page || 1;
    const limit = +this.queryStr.limit || 10;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(count / limit);
    if (page > totalPages) throw new AppError("Page invalid", 404);
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
