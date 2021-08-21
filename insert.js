const wkt = require("terraformer-wkt-parser");
const fs = require("fs");
const { getConn } = require("./pool");

function polygonInsert(geojson, table, field) {
  /**
   * @description 해당 multypolygon in geojson 삽입은 기준점(ex. ADMCD)이 필요합니다.
   * geojson파일을 같은 디렉토리안에 두고 실행해주세요.
   * @argument geojson geojson파일명
   * @argument table 변경이 이루어질 테이블명
   * @argument field 변환된 좌표타입의 데이터가 들어갈 필드
   */
  fs.readFile(geojson, "utf8", (err, data) => {
    (async () => {
      const conn = await getConn();
      let obj = JSON.parse(data);
      for (let i = 0; i < obj.features.length; i++) {
        // ADMCD는 행정코드명으로 geojson에서 지역별 고유한 값(고유한 값이기 때문에 기준으로 삼음)
        await conn.execute(
          `
        UPDATE ${table} SET ${field} = ST_PolygonFromText('${wkt.convert(obj.features[i].geometry)}') where ADMCD = ?`,
          [obj.features[i].properties.adm_cd2]
        );
        console.log(obj.features[i].properties.adm_cd2);
      }
    })();
  });
}

// geojson에 multipolygon타입 데이터 삽입
polygonInsert("example.geojson", "District", "geopolygon");
