const { createApp } = Vue;

createApp({
  data() {
    return {
      items: [],
      analysisData: [],
      checkedNames: [],
      allTypes: [],
      winStatusMap: {
        "-1": "不確定",
        0: "輸",
        1: "贏",
        2: "小運氣贏",
        3: "大運氣贏"
      }
    };
  },
  methods: {
    init() {
      fetch("./data.json")
        .then((response) => response.json())
        .then((json) => {
          json.reverse();
          for (const item of json) {
            item.betTime = this.getTime(item.betAt);
            this.generateAnalysis(item);
          }
          this.importBRInfo(json);
          this.items = json;

          this.getTotalAnalysis();
        });
    },
    showRow(item) {
      if (this.checkedNames.indexOf(item) > -1) {
        return true;
      } else {
        return false;
      }
    },
    checkType(e, target) {
      if (target === "全部玩法") {
        if (this.checkedNames.indexOf("全部玩法") > -1) {
          this.checkedNames = this.allTypes;
        } else {
          this.checkedNames = [];
        }
      }
    },
    getTotalAnalysis() {
      if (this.analysisData.length > 0) {
        let winTotal = 0;
        let loseTotal = 0;
        let costTotal = 0;
        let payoutTotal = 0;
        for (const data of this.analysisData) {
          winTotal += data.win;
          loseTotal += data.lose;
          costTotal += data.cost;
          payoutTotal += data.payout;
        }
        this.analysisData.push({
          name: "全部玩法",
          win: winTotal,
          lose: loseTotal,
          cost: costTotal,
          payout: payoutTotal
        });
        this.allTypes.push("全部玩法");
      }
      for (const data of this.analysisData) {
        data.winRatio = this.getWinRatio(data.win, data.lose);
        data.total = parseInt(data.payout) - parseInt(data.cost);
        this.checkedNames.push(data.name);
      }
    },
    generateAnalysis(item) {
      let bExist = false;
      let idx = -1;
      const analysisName = item.wagerDetail.selections[0].betTypeName;
      for (const [i, data] of this.analysisData.entries()) {
        if (data.name === analysisName) {
          bExist = true;
          idx = i;
          break;
        }
      }
      if (!bExist) {
        this.analysisData.push({
          name: analysisName,
          win: 0,
          lose: 0,
          cost: 0,
          payout: 0
        });
        this.allTypes.push(analysisName);
        idx = this.analysisData.length - 1;
      }
      if (item.totalPayout === "0") {
        this.analysisData[idx].lose++;
      } else {
        this.analysisData[idx].win++;
      }
      this.analysisData[idx].cost += parseFloat(item.totalStake);
      this.analysisData[idx].payout += parseFloat(item.totalPayout);
    },
    getWinRatio(win, lose) {
      let result = parseFloat(win / (win + lose))
        .toFixed(3)
        .split(".")[1];

      return result.slice(0, 2) + "." + result.slice(2, 3) + "%";
    },
    getTime(time) {
      const timeValue = new Date(time);
      return `${timeValue.getHours().toString().padStart(2, "0")}:${timeValue
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${timeValue
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    },
    getDiffTime(num1, num2) {
      // return seconds
      if (num2 === "-" || !num2) {
        return "";
      }
      return `(${
        num2.split(":")[0] * 60 +
        num2.split(":")[1] * 1 -
        (num1.split(":")[0] * 60 + num1.split(":")[1] * 1)
      }s)`;
    },
    importBRInfo(src) {
      // 0:lose, 1:win, 2:continueWin, 3:furthurWin
      const winStatus = [
        0, 0, 3, 0, 1, 3, 3, 1, 3, 2, 3, 0, 1, 1, 1, 1, 0, 1, 1, 2, 3, 2, 1, 1,
        2, 2, 1, 1, 2, 1, 3, 1, 2, 2, 2, 1, 1, 2, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1
      ];
      const dangerTimeList = [
        "-",
        "-",
        "17:35",
        "-",
        "72:48",
        "-",
        "08:42",
        "15:50",
        "21:53",
        "27:13",
        "26:38",
        "-",
        "36:54",
        "40:36",
        "11:48",
        "55:32",
        "81:38",
        "62:33",
        "66:57",
        "68:42",
        "-",
        "30:51",
        "31:24",
        "75:39",
        "76:56",
        "05:51",
        "38:19",
        "38:36",
        "79:28",
        "84:28",
        "-",
        "23:25",
        "04:20",
        "04:06",
        "07:43",
        "08:03",
        "07:00",
        "40:46",
        "13:20",
        "-",
        "16:42",
        "16:08",
        "20:16",
        "19:17",
        "21:36",
        "20:43",
        "23:59",
        "65:10",
        "23:26",
        "28:20",
        "28:40",
        "31:37",
        "70:38",
        "30:07",
        "51:39",
        "54:39",
        "54:02",
        "84:02",
        "57:13",
        "17:16",
        "-",
        "65:26",
        "62:44",
        "65:45"
      ];
      const goalTimeList = [
        "-",
        "-",
        "-",
        "-",
        "72:54",
        "-",
        "-",
        "16:36",
        "-",
        "27:37",
        "-",
        "-",
        "37:08",
        "40:47",
        "11:55",
        "55:47",
        "-",
        "62:43",
        "67:03",
        "68:54",
        "-",
        "30:58",
        "31:30",
        "75:59",
        "77:06",
        "06:04",
        "38:31",
        "38:39",
        "79:39",
        "84:39",
        "-",
        "23:29",
        "04:27",
        "04:16",
        "07:57",
        "08:05",
        "07:09",
        "40:50",
        "13:59",
        "-",
        "17:19",
        "16:16",
        "20:33",
        "19:29",
        "22:02",
        "20:50",
        "24:43",
        "65:14",
        "23:40",
        "29:12",
        "28:42",
        "-",
        "70:47",
        "30:23",
        "51:55",
        "54:50",
        "55:04",
        "84:38",
        "57:22",
        "17:21",
        "-",
        "65:51",
        "62:56",
        "66:06"
      ];

      for (const [i, data] of src.entries()) {
        if (i >= dangerTimeList.length) {
          break;
        }
        data.dangerTime = dangerTimeList[i];
        data.goalTime = goalTimeList[i];
        data.winStatus = winStatus[i];
        data.winStatusName = this.winStatusMap[data.winStatus];
      }
    }
  },
  mounted() {
    this.init();
  }
}).mount("#app");
