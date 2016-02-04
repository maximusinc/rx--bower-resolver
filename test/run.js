var index = require('../lib/index');
var utils = require('../lib/utils');

var res1 = index().match('nexus://exapmle.com');
console.log(res1);

var metadataUrl = utils.getMetadataXmlRoute('http://ocb:1KkfMKa2BawHdHRWpaIZ@repo.rooxteam.com/customers/service/local/artifact/maven/content?r=roox.snapshots&g=com.rooxteam.wms&a=wrs-features&e=jar&v=2.3.18-SNAPSHOT', 'http://nexus.rooxintra.net/content/repositories/releases/');
console.log(metadataUrl);
