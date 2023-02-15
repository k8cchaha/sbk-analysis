const { createApp } = Vue;

createApp({
  data() {
    return {
      items: [],
      analysisData: []
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
          this.items = json;

          this.getTotalAnalysis();
        });
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
      }
      for (const data of this.analysisData) {
        data.winRatio = this.getWinRatio(data.win, data.lose);
        data.total = parseInt(data.payout) - parseInt(data.cost);
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
      if (!num2) {
        return "(-)";
      }
      return `${
        num2.split(":")[0] * 60 +
        num2.split(":")[1] -
        (num1.split(":")[0] * 60 + num1.split(":")[1])
      }s`;
    }
  },
  mounted() {
    this.init();
  }
}).mount("#app");
