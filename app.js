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
      const time2 =
        num2.split(":")[0] * 60 * 60 +
        num2.split(":")[1] * 60 +
        num2.split(":")[2] * 1;
      const time1 =
        num1.split(":")[0] * 60 * 60 +
        num1.split(":")[1] * 60 +
        num1.split(":")[2] * 1;

      const diff = time2 - time1;

      return `(${diff}s)`;

      // return `(${
      //   num2.split(":")[0] * 60 +
      //   num2.split(":")[1] * 1 -
      //   (num1.split(":")[0] * 60 + num1.split(":")[1] * 1)
      // }s)`;
    },
    importBRInfo(src) {
      // 0:lose, 1:win, 2:continueWin, 3:furthurWin
      const winStatus = [
        0, 0, 3, 0, 1, 3, 3, 1, 3, 2, 3, 0, 1, 1, 1, 1, 0, 1, 1, 2, 3, 2, 1, 1,
        2, 2, 1, 1, 2, 1, 3, 1, 2, 2, 2, 1, 1, 2, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1
      ];
      const dangerTimeList = [
        "-",
        "-",
        "19:48:38",
        "-",
        "20:29:01",
        "-",
        "20:40:34",
        "20:47:42",
        "20:53:45",
        "20:59:05",
        "20:59:22",
        "-",
        "21:36:54",
        "21:43:14",
        "22:11:59",
        "22:13:04",
        "22:15:48",
        "22:23:41",
        "22:27:04",
        "22:28:18",
        "-",
        "22:32:23",
        "22:32:40",
        "22:35:20",
        "22:36:06",
        "22:36:57",
        "22:38:30",
        "22:39:52",
        "22:40:54",
        "22:44:34",
        "-",
        "22:54:51",
        "23:03:40",
        "23:06:01",
        "23:07:37",
        "23:09:06",
        "23:11:06",
        "23:13:22",
        "23:13:32",
        "-",
        "23:18:14",
        "23:18:46",
        "23:21:47",
        "23:22:24",
        "23:22:59",
        "23:23:28",
        "23:25:06",
        "23:25:30",
        "23:25:46",
        "23:29:42",
        "23:29:42",
        "23:32:08",
        "23:33:09",
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
        "65:45",
        "52:23",
        "68:54",
        "63:14"
      ];
      const goalTimeList = [
        "-",
        "-",
        "-",
        "-",
        "20:29:08",
        "-",
        "-",
        "20:48:28",
        "-",
        "20:59:29",
        "-",
        "-",
        "21:37:07",
        "21:43:25",
        "22:12:06",
        "22:13:19",
        "-",
        "22:23:51",
        "22:27:10",
        "22:28:30",
        "-",
        "22:32:30",
        "22:32:46",
        "22:35:40",
        "22:36:16",
        "22:37:10",
        "22:38:42",
        "22:39:55",
        "22:41:05",
        "22:44:45",
        "-",
        "22:54:55",
        "23:03:47",
        "23:06:10",
        "23:07:51",
        "23:09:07",
        "23:11:15",
        "23:13:25",
        "23:14:11",
        "-",
        "23:18:51",
        "23:18:54",
        "23:22:04",
        "23:22:35",
        "23:23:25",
        "23:23:36",
        "23:25:50",
        "23:25:35",
        "23:26:00",
        "23:30:35",
        "23:29:44",
        "-",
        "23:33:18",
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
        "66:06",
        "52:30",
        "69:22",
        "63:29"
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
