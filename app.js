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
      },
      analysisCount: 0,
      delayInfo: []
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
          this.generateAnalysisChart(json);
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

      return time2 - time1;
    },
    generateAnalysisChart(dataSet) {
      // chart data
      const orderCountObj = {};
      let maxDelay = 0;
      let orderCount = 0;
      for (const data of dataSet) {
        if (data.winStatus === 1) {
          orderCount++;
          const delay = data.dangerDiff >= 0 ? data.dangerDiff : 0;

          if (!orderCountObj[delay]) {
            orderCountObj[delay] = 0;
          }
          orderCountObj[delay]++;

          if (delay > maxDelay) {
            maxDelay = delay;
          }
        }
      }

      this.analysisCount = orderCount;

      const labels = [];
      const srcData = [];
      const comboData = [];
      let combo = 0;
      for (let i = 0; i <= maxDelay; i++) {
        if (orderCountObj[i]) {
          labels.push(`延遲 ${i} ~ ${i + 1} 秒`);
          srcData.push(orderCountObj[i]);
          comboData.push(combo);

          this.delayInfo.push({
            name: `延遲 ${i + 1} 秒`,
            percentage:
              Math.round(((combo + orderCountObj[i]) / orderCount) * 100) + " %"
          });

          combo += orderCountObj[i];
        }
      }

      const ctx = document.getElementById("chart");

      const data = {
        labels: labels,
        datasets: [
          {
            label: "延遲秒數筆數",
            data: srcData,
            borderColor: "#ff63c4",
            backgroundColor: "#ff6384",
            stack: "combined",
            type: "bar"
          },
          {
            label: "向前涵蓋筆數",
            data: comboData,
            borderColor: "#3080d0",
            backgroundColor: "#3080f0",
            stack: "combined"
          }
        ]
      };

      new Chart(ctx, {
        type: "line",
        data: data,
        options: {
          plugins: {
            title: {
              display: true,
              text: "下注延遲秒數分析"
            }
          },
          scales: {
            y: {
              stacked: true
            }
          }
        }
      });
    },
    importBRInfo(src) {
      // 0:lose, 1:win, 2:continueWin, 3:furthurWin
      const winStatus = [
        0, 0, 3, 0, 1, 3, 3, 1, 3, 1, 3, 0, 1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 1, 1,
        2, 2, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1,
        1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 3, 3, 3, 0, 1, 1, 1,
        1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
        1, 0, 1, 1, 3, 1, 0, 1, 1, 1, 1, 0, 1, 1
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
        "22:28:22",
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
        "23:33:43",
        "0:12:38",
        "0:14:00",
        "0:14:39",
        "0:15:17",
        "0:16:33",
        "0:17:16",
        "0:20:08",
        "0:22:49",
        "0:23:34",
        "0:24:32",
        "0:26:01",
        "0:27:35",
        "0:27:44",
        "0:27:50",
        "0:28:25",
        "0:29:37",
        "0:29:37",
        "0:31:04",
        "0:31:10",
        "0:31:24",
        "0:32:19",
        "0:32:48",
        "0:32:50",
        "0:33:13",
        "0:33:28",
        "0:34:40",
        "0:37:36",
        "0:37:51",
        "0:38:00",
        "0:38:14",
        "0:38:38",
        "0:38:35",
        "0:38:55",
        "0:40:15",
        "0:40:24",
        "0:40:35",
        "0:40:44",
        "0:40:59",
        "0:41:16",
        "0:42:35",
        "0:43:11",
        "0:43:23",
        "0:44:51",
        "0:44:53",
        "0:45:23",
        "0:45:35",
        "0:45:56",
        "0:46:18",
        "0:47:42",
        "0:48:23",
        "0:48:25",
        "0:49:19",
        "0:50:09",
        "0:50:48",
        "0:52:17",
        "0:52:32",
        "1:03:10",
        "1:08:33",
        "1:31:12",
        "1:35:56",
        "1:40:30",
        "1:45:40",
        "1:50:40",
        "1:54:46",
        "1:59:47",
        "2:00:51",
        "2:03:15",
        "2:06:15",
        "2:13:04",
        "2:21:19",
        "2:27:26",
        "2:27:35",
        "2:27:44",
        "2:29:12",
        "2:40:57",
        "2:45:26",
        "2:51:35",
        "2:52:50",
        "3:05:56",
        "3:10:41",
        "3:24:39",
        "3:45:06",
        "3:46:03",
        "4:08:58",
        "4:11:14",
        "4:18:25",
        "4:20:26",
        "4:31:07",
        "4:32:04",
        "4:59:48",
        "5:09:19",
        "5:29:46",
        "5:29:53",
        "5:52:22",
        "-",
        "6:30:02",
        "-",
        "7:36:53",
        "7:42:57",
        "8:57:16",
        "9:39:37",
        "9:46:24",
        "11:18:17",
        "11:30:02"
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
        "23:33:59",
        "0:12:54",
        "0:14:11",
        "0:15:42",
        "0:15:53",
        "0:16:42",
        "0:17:21",
        "0:20:24",
        "0:23:14",
        "0:23:46",
        "0:24:52",
        "0:26:08",
        "0:28:03",
        "0:27:59",
        "0:28:07",
        "0:28:49",
        "0:32:03",
        "0:29:43",
        "0:31:24",
        "0:31:26",
        "0:31:45",
        "0:32:34",
        "0:33:00",
        "0:33:06",
        "0:33:27",
        "0:33:32",
        "0:34:45",
        "0:37:44",
        "0:38:07",
        "0:38:29",
        "0:38:21",
        "0:38:57",
        "0:38:59",
        "0:39:05",
        "0:40:37",
        "0:40:51",
        "0:40:41",
        "0:40:53",
        "0:41:10",
        "0:41:40",
        "0:42:42",
        "0:43:52",
        "0:43:28",
        "0:45:01",
        "0:45:09",
        "-",
        "0:46:03",
        "0:46:11",
        "0:46:41",
        "0:48:04",
        "0:48:52",
        "0:48:39",
        "0:49:34",
        "0:50:15",
        "0:50:54",
        "0:52:24",
        "0:52:39",
        "-",
        "1:08:44",
        "1:31:17",
        "-",
        "-",
        "1:46:22",
        "1:52:52",
        "1:54:53",
        "2:00:09",
        "2:01:01",
        "2:03:29",
        "2:06:18",
        "2:13:14",
        "2:21:21",
        "2:27:49",
        "-",
        "2:27:50",
        "2:29:25",
        "2:41:02",
        "2:47:11",
        "2:51:43",
        "2:53:10",
        "-",
        "3:10:54",
        "3:25:10",
        "3:45:13",
        "3:46:13",
        "4:09:08",
        "-",
        "4:18:43",
        "4:20:41",
        "4:31:16",
        "4:32:15",
        "4:59:56",
        "5:09:32",
        "5:30:15",
        "5:30:03",
        "5:53:28",
        "-",
        "6:31:50",
        "-",
        "7:37:02",
        "7:43:02",
        "8:59:34",
        "9:39:52",
        "-",
        "11:18:19",
        "11:30:05"
      ];

      for (const [i, data] of src.entries()) {
        if (i >= dangerTimeList.length) {
          break;
        }
        data.dangerTime = dangerTimeList[i];
        data.goalTime = goalTimeList[i];
        data.winStatus = winStatus[i];
        data.winStatusName = this.winStatusMap[data.winStatus];
        data.dangerDiff = this.getDiffTime(data.betTime, data.dangerTime);
        data.goalDiff = this.getDiffTime(data.betTime, data.goalTime);
      }
    }
  },
  mounted() {
    this.init();
  }
}).mount("#app");
