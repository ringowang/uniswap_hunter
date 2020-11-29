import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import numeral from "numeral";
import { Table, Input, DatePicker, Select } from "antd";

const baseURL = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2";

async function getUniswapPairs({
  first = 1000,
  orderBy = "createdAtTimestamp",
  orderDirection = "desc",
  createdAtTimestampGt = moment().unix() - 72 * 3600,
  createdAtBlockNumber = null,
} = {}) {
  const query = `
    {
      pairs(
        first: ${first},
        orderBy: ${orderBy},
        orderDirection: ${orderDirection},
        where: {
          createdAtTimestamp_gt: ${createdAtTimestampGt},
          ${createdAtBlockNumber ? `createdAtBlockNumber: ${createdAtBlockNumber}` : ''}
        }
      ){
        id
        token0{
          id
          symbol
          name
          decimals
          totalSupply
          tradeVolume
          tradeVolumeUSD
          untrackedVolumeUSD
          txCount
          totalLiquidity
          derivedETH
        }
        token1{
          id
          symbol
          name
          decimals
          totalSupply
          tradeVolume
          tradeVolumeUSD
          untrackedVolumeUSD
          txCount
          totalLiquidity
          derivedETH
        }
        createdAtTimestamp
        createdAtBlockNumber
      }
    }
  `;
  const res = await axios.post(baseURL, { query });
  return res.data.data.pairs;
}

async function getUniswapPairDayDatas({
  first = 1000,
  orderBy = "dailyVolumeUSD",
  orderDirection = "desc",
  dateGt = moment().unix() - 24 * 3600,
  pairAddressIn = [],
  dailyVolumeUSDGt = 1000,
} = {}) {
  const query = `
    {
      pairDayDatas(
        first: ${first},
        orderBy: ${orderBy},
        orderDirection: ${orderDirection} ,
        where: {
          date_gt: ${dateGt},
          pairAddress_in: ${JSON.stringify(pairAddressIn)},
          dailyVolumeUSD_gt: ${dailyVolumeUSDGt},
        }
      ){
        token0{
          id
          symbol
          name
          decimals
          totalSupply
          tradeVolume
          tradeVolumeUSD
          untrackedVolumeUSD
          txCount
          totalLiquidity
          derivedETH
        }
        token1{
          id
          symbol
          name
          decimals
          totalSupply
          tradeVolume
          tradeVolumeUSD
          untrackedVolumeUSD
          txCount
          totalLiquidity
          derivedETH
        }
        dailyVolumeUSD
        id
        pairAddress
        dailyVolumeToken0
        dailyVolumeToken1
        date
      }
    }
  `;
  const res = await axios.post(baseURL, { query });
  return res.data.data.pairDayDatas;
}

async function loadData(setLoading, setPairs, {
  first,
  orderBy,
  orderDirection,
  dailyVolumeUSDGt,
  createdAtTimestampGt,
}) {
  setLoading(true);
  const pairs = await getUniswapPairs({
    first,
    // orderBy,
    orderDirection,
    createdAtTimestampGt,
  });
  const datas = await getUniswapPairDayDatas({
    first,
    orderBy,
    orderDirection,
    dateGt: moment().unix() - 24 * 3600,
    pairAddressIn: pairs.map(pair => pair.id),
    dailyVolumeUSDGt,
  });
  setPairs(datas);
  setLoading(false);
}

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    render: (text) => {
      const address = text.split("-")[0]
      return <a target="_blank" rel="noopener noreferrer" href={`https://www.dextools.io/app/uniswap/pair-explorer/${address}`}>{text}</a>
    }
  },
  {
    title: 'Token0',
    dataIndex: 'token0',
    key: 'token0',
    render: (text) => {
      return <a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/token/${text.id}`}>{text.symbol}</a>;
    }
  },
  {
    title: 'Token1',
    dataIndex: "token1",
    key: "token1",
    render: (text) => {
      return <a target="_blank" rel="noopener noreferrer" href={`https://etherscan.io/token/${text.id}`}>{text.symbol}</a>;
    }
  },
  {
    title: 'dailyVolumeToken0',
    dataIndex: 'dailyVolumeToken0',
    key: 'dailyVolumeToken0',
  },
  {
    title: 'dailyVolumeToken1',
    dataIndex: 'dailyVolumeToken1',
    key: 'dailyVolumeToken1',
  },
  {
    title: 'dailyVolumeUSD',
    dataIndex: 'dailyVolumeUSD',
    key: 'dailyVolumeUSD',
    responsive: ['md'],
    align: 'right',
    render: (text) => {
      return numeral(text).format("$ 0,0.0");
    }
  },
];

export default function App()  {
  const now = moment().unix();
  const [pairs, setPairs] = useState([]);
  const [first, setFirst] = useState(1000);
  const [orderBy, setOrderBy] = useState("dailyVolumeUSD");
  const [orderDirection, setOrderDirection] = useState("desc");
  const [dailyVolumeUSDGt, setDailyVolumeUSDGt] = useState(1000);
  const [createdAtTimestampGt, setCreatedAtTimestampGt] = useState(now - 72 * 3600);
  const [createdAtBlockNumber, setCreatedAtBlockNumber] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData(setLoading, setPairs, {
      first,
      orderBy,
      orderDirection,
      dailyVolumeUSDGt,
      createdAtTimestampGt,
    });
  }, [first, orderBy, orderDirection, dailyVolumeUSDGt, createdAtTimestampGt]);

  return (
    <>
      <h3> Uniswap Pair Trading </h3>
      <table>
        <tbody>
          <tr>
            <td>First</td>
            <td>
              <Input style={{ width: 200 }} value={first} onChange={ e => setFirst(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td>OrderBy</td>
            <td>
              <Select
                value={orderBy}
                options={[
                  { label: "dailyVolumeUSD", value: "dailyVolumeUSD" },
                  { label: "dailyVolumeToken0", value: "dailyVolumeToken0" },
                  { label: "dailyVolumeToken1", value: "dailyVolumeToken1" },
                ]}
                onChange={value => setOrderBy(value)}
              />
            </td>
          </tr>
          <tr>
            <td>
              OrderDirection
            </td>
            <td>
              <Select
                value={orderDirection}
                options={[
                  { label: "Desc", value: "desc" },
                  { label: "Asc", value: "asc" },
                ]}
                onChange={value => setOrderDirection(value)}
              />
            </td>
          </tr>
          <tr>
            <td>Creaeted After</td>
            <td>
              <DatePicker
                value={moment.unix(createdAtTimestampGt)}
                onChange={value => {
                  setCreatedAtTimestampGt(value.unix());
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Daily Volume More Then</td>
            <td><Input value={dailyVolumeUSDGt} onChange={e => setDailyVolumeUSDGt(e.target.value)} /></td>
          </tr>
          <tr>
            <td>Creaeted At Block Number</td>
            <td>
              <Input
                value={createdAtBlockNumber}
                onChange={e => {
                  setCreatedAtBlockNumber(e.target.value);
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <Table
        style={{ marginTop: 8 }}
        loading={loading}
        size="small"
        pagination={{
          pageSize: 100,
        }}
        columns={columns}
        dataSource={pairs.map(pair => ({ ...pair, key: pair.id }))}
      />
      </>
  );
}
