import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {CartType} from "../../../../types/cart.type";
import {FavoriteService} from "../../services/favorite.service";
import {CartService} from "../../services/cart.service";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'favorite-product',
  templateUrl: './favorite-product.component.html',
  styleUrls: ['./favorite-product.component.scss']
})
export class FavoriteProductComponent implements OnInit {

  @Input() product: FavoriteType = {
    id: '',
    name: '',
    url: '',
    image: '',
    price: 0,
    countInCart: 0
  };

  countInCart: boolean = false;

  constructor(private favoriteService: FavoriteService, private cartService: CartService) {
  }
  count: number = 1;
  @Output() removeFromFavoritesEvent: EventEmitter<string> = new EventEmitter<string>()

  ngOnInit() {
    this.cartService.getCart()
      .subscribe((cartData: CartType | DefaultResponseType) => {
        if ((cartData as DefaultResponseType).error !== undefined) {
          throw new Error((cartData as DefaultResponseType).message);
        }
        const cartDataResponse = cartData as CartType;
        if (cartDataResponse) {
            const productInCart = cartDataResponse.items.find(product => product.product.id === this.product.id);
            if (productInCart) {
              this.product.countInCart = productInCart.quantity;
              this.count = this.product.countInCart
              if(this.product.countInCart) {
                this.countInCart = true
              }
          }
        }
      });
  }

  serverStaticPath = environment.serverStaticPath;

  removeFromCartFavorites(id: string) {
    this.cartService.updateCart(id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.product.countInCart = 0;
        this.count = 1;
        this.countInCart = false
      })
  }

  updateCount(count: number) {
    this.count = count;
    this.cartService.updateCart(this.product.id, this.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.product.countInCart = count;
      })
  }

  addToCart(id: string) {
    // this.product.countInCart = this.count;
    this.cartService.updateCart(id, this.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.product.countInCart = this.count;
        this.countInCart = true
      })
  }

  removeFromFavorites() {
    this.removeFromFavoritesEvent.emit(this.product.id);
  }

}
