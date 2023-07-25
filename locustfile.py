from locust import HttpUser, task, between, TaskSet

class UserBehavior(TaskSet):
    @task
    def load_companies(self):
        self.client.get("/data/companies")

    @task
    def load_stock_price(self):
        self.client.get("/data/stock-price/AAPL")  # Here AAPL is an example, replace with real stock symbol

    @task
    def get_all_notifications(self):
        self.client.get("/notifications/getAllNotifications")

    @task
    def get_all_posts(self):
        self.client.get("/posts/")

    @task
    def get_pending_orders(self):
        self.client.get("/summary/pending-orders")

    @task
    def get_open_positions(self):
        self.client.get("/summary/open-positions")

    @task
    def order(self):
        self.client.post("/transactions/order", json={"symbol": "AAPL", "quantity": 10, "price": 150})  # Example

    @task
    def register_user(self):
        self.client.post("/auth/register", json={"username": "test_user", "password": "test_password"})  # Example

    @task
    def login_user(self):
        self.client.post("/auth/login", json={"username": "test_user", "password": "test_password"})  # Example

    @task
    def get_user_balance(self):
        self.client.get("/auth/balance")

    @task
    def get_user_info(self):
        self.client.get("/auth/info")

    @task
    def get_stock_percentages(self):
        self.client.get("/charts/stock-percentages")

    @task
    def get_profit_loss(self):
        self.client.get("/charts/profit-loss")


class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(5, 15)
