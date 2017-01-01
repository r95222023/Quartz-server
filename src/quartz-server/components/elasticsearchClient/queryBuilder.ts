function buildQuerySort(sort: string) {
  let isDesc = sort.split('-')[1],
    sortBy = isDesc ? isDesc : sort,
    res: any = {};
  res[sortBy] = {"order": !!isDesc ? "desc" : "asc"};
  return res;
}

//ex
// data={
//   cate:1,
//   subCate:0,
//   tag:'new',
//   queryString:'chicker',
//   orderBy:'id',
//   from: 0,
//   size: 5
// };
function buildQuery(data: any) {
  let res: any = {};
  res.index = data.siteName;
  if (data.type) res.type = data.type;
  res.size = data.size || 5;
  res.from = data.from || 0;
  res.body = buildBody(data);
  return res;
}

function buildBody(data: any) {
  let type = data.type,
    cate = isNaN(data.cate) ? data.cate : null,
    subCate = isNaN(data.subCate) ? data.subCate : null,
    tag = data.tag || null,
    queryString = data.queryString || '',
    query_string: any,
    sort = data.sort,
    mustArr: any = [],
    mustNotArr: any = [{"term": {"show": false}}];

  if (typeof tag === 'string') {
    let tagTerm: any = {};
    tagTerm['tags.' + tag] = 1;
    mustArr.push({"term": tagTerm});
  }
  if (parseInt(cate) % 1 === 0) {
    mustArr.push({"term": {"category": cate}});
    if (parseInt(subCate) % 1 === 0) mustArr.push({"term": {"subcategory": subCate}});
  }

  if (typeof queryString === 'string' && queryString.trim() !== '') {
    query_string = {
      "fields": type === 'article' ? ["title", "description"] : ["itemName", "description"],
      "query": queryString,
      "use_dis_max": true
    };
  }

  let queryBody: any = {
    query: {
      "bool": {}
    }
  };

  if (mustArr) queryBody.query.bool.must = mustArr;
  if (mustNotArr) queryBody.query.bool['must_not'] = mustNotArr;
  if (query_string) queryBody.query['query_string'] = query_string;
  if (sort) queryBody.sort = buildQuerySort(sort);
  return queryBody;
}

export = {
  buildBody: buildBody,
  buildQuery: buildQuery
}


