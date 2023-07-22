//creates a common companies controllers instance to be used by all routes and controllers
import CompaniesController from "../controllers/populateDropDownController.js";

const companiesController = new CompaniesController();

export default companiesController;
