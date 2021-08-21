const proj4 = require("proj4");
const { getConn } = require("./pool");
proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

async function geopointTransform(x, y, table, field, count) {
  /**
   * @description 해당 변환은 같은 테이블안에서 id값이 정렬된 경우에만 사용가능합니다.
   * csv파일이나 geojson파일에서 id값을 정렬한 후에 사용하여 주세요.
   * @argument x 5179좌표계의 위도
   * @argument y 5179좌표계의 경도
   * @argument table 변경이 이루어질 테이블명
   * @argument field 변환된 좌표타입의 데이터가 들어갈 필드
   * @argument count id의 갯수
   */
  let i = 1;
  const conn = await getConn();
  while (i < count) {
    // 변환된 좌표 확인 (X, Y 각 자리에는 입력한 x, y가 들어가야함)
    const [[{ X, Y }]] = await conn.query(`select ${x}, ${y} from ${table} where id = ?`, [i]);
    let wgs84 = await proj4("EPSG:5179", "EPSG:4326", [X, Y]);
    await conn.execute(`UPDATE ${table} SET ${field} = ST_GeomFromText('POINT(${wgs84[0]} ${wgs84[1]})') where id = ?`, [i]);
    // 변환된 좌표 확인 (geopoint 자리에는 입력한 field가 들어가야함)
    const [[{ geopoint }]] = await conn.query(`SELECT ${field} FROM ${table} WHERE id = ?`, [i]);
    console.log("id: " + i);
    console.log(geopoint);
    i++;
  }
}

// EPSG:5179 to EPSG:4326 좌표계 변환 및 변환된 데이터 삽입
geopointTransform("X", "Y", "District", "geopoint", 3496);
