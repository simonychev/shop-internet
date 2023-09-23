import {Component, OnInit} from '@angular/core';
import {OwlOptions} from "ngx-owl-carousel-o";
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {ActivatedRoute} from "@angular/router";
import {environment} from "../../../../environments/environment";
import {CartType} from "../../../../types/cart.type";
import {CartService} from "../../../shared/services/cart.service";
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {AuthService} from "../../../core/auth/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  recommendedProducts: ProductType[] = [];
  product!: ProductType;
  serverStaticPath = environment.serverStaticPath;
  count: number = 1;
  isLogged: boolean = false;
  constructor(private productService: ProductService, private activatedRoute: ActivatedRoute,
              private cartService: CartService, private favoriteService: FavoriteService,
              private authService: AuthService, private _snackBar:MatSnackBar) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.authService.isLogged$
      .subscribe((isLoggedIn: boolean) => {
        this.isLogged = isLoggedIn;
      });

    this.activatedRoute.params
      .subscribe(params => {
        this.productService.getProduct(params['url'])
          .subscribe((data: ProductType) => {
            this.product = data;
            this.cartService.getCart()
              .subscribe((cartData: CartType | DefaultResponseType) => {
                if ((cartData as DefaultResponseType).error !== undefined) {
                  throw new Error((cartData as DefaultResponseType).message);
                }
                const cartDataResponse = cartData as CartType;
                if (cartDataResponse) {
                  const productInCart = cartDataResponse.items.find(item => item.product.id === data.id);
                  if (productInCart) {
                    data.countInCart = productInCart.quantity;
                    this.count = data.countInCart;
                  }
                }

                if (this.authService.getIsLoggedIn()) {
                this.favoriteService.getFavorites()
                  .subscribe((data: FavoriteType[] | DefaultResponseType) => {
                    if ((data as DefaultResponseType).error !== undefined) {
                      const error = (data as DefaultResponseType).message;
                      throw new Error(error);
                    }
                    const products = data as FavoriteType[];
                    const currentProductExists = products.find(item => item.id === this.product.id);
                    if (currentProductExists) {
                      this.product.isInFavorite = true;
                    }
                  });
              }
              })
          })
      });

    this.productService.getBestProducts()
      .subscribe((data: ProductType[]) => {
        this.recommendedProducts = data;
      })
  }

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    margin: 24,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: false
  }

  updateCount(value: number) {
   this.count = value;
    if (this.product.countInCart) {
      this.cartService.updateCart(this.product.id, this.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            throw new Error((data as DefaultResponseType).message);
          }
          this.product.countInCart = this.count;
          // this.cartService.count = this.count;
        })
    }
  }

  addToCart() {
    this.cartService.updateCart(this.product.id, this.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.product.countInCart = this.count;
      })
  }
  removeFromCart() {
    this.cartService.updateCart(this.product.id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.product.countInCart = 0;
        this.count = 1;
      })
  }

  updateFavorite() {
    if (!this.authService.getIsLoggedIn()) {
      this._snackBar.open('Для добавления в избранное необходимо авторизоваться');
      return;
    }
    if (this.product.isInFavorite) {
      this.favoriteService.removeFavorite(this.product.id)
        .subscribe((data: DefaultResponseType) => {
          if (data.error) {
            throw new Error(data.message);
          }
          this.product.isInFavorite = false;
        })
    } else {
      this.favoriteService.addFavorite(this.product.id)
        .subscribe((data: FavoriteType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            throw new Error((data as DefaultResponseType).message);
          }
          this.product.isInFavorite = true;
        });
    }
  }
}
