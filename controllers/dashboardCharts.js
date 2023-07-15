import PortfolioModel from "../models/Portfolio";
async function getStockPercentages(req, res) {
    try {
        const user_id = req.user.id;

        //Find all their open positions
        const positions = await PortfolioModel.find({
            user: user_id,
        }).populate("positions");

        const open_positions = positions.filter((position) => position.positionStatus === "open");

        //Treatment is the same for long and short positions as their cash balance is locked
        const total_invested_amount = open_positions.reduce(
            (acc, position) => acc + position.totalAmount,
            0
        );

        let result = [];
        open_positions.forEach((position) => {
            const percentage = (position.totalAmount / total_invested_amount) * 100;
            const roundedPercentage = Math.round(percentage * 100) / 100; // Round to 2 decimal points
            result.push({
                stock: position.symbol,
                percentage: roundedPercentage,
            });
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export { getStockPercentages };
