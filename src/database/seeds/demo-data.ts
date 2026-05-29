import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Article, ArticleStatus } from '../../modules/blog/entities/article.entity';
import { ServiceCategory } from '../../modules/catalog/entities/service-category.entity';
import { Service } from '../../modules/catalog/entities/service.entity';
import { Doctor } from '../../modules/doctors/entities/doctor.entity';
import { GalleryCase } from '../../modules/gallery/entities/gallery-case.entity';
import { Review } from '../../modules/reviews/entities/review.entity';

const SERVICES_BY_CATEGORY: Record<
  string,
  Array<{ name: string; price: number; durationMinutes: number; description: string }>
> = {
  therapy: [
    {
      name: 'Лікування карієсу',
      price: 1200,
      durationMinutes: 60,
      description: 'Видалення ураженої тканини та реставрація зуба фотополімером.',
    },
    {
      name: 'Професійна гігієна порожнини рота',
      price: 900,
      durationMinutes: 45,
      description: 'Ультразвукове чищення, Air Flow та поліровка.',
    },
  ],
  implantation: [
    {
      name: 'Імплантація під ключ',
      price: 18000,
      durationMinutes: 120,
      description: 'Встановлення імпланта з коронкою за системою преміумкласу.',
    },
  ],
  orthodontics: [
    {
      name: 'Встановлення брекет-системи',
      price: 22000,
      durationMinutes: 90,
      description: 'Металева або керамічна брекет-система з повним супроводом.',
    },
  ],
  aesthetic: [
    {
      name: 'Відбілювання зубів',
      price: 5000,
      durationMinutes: 75,
      description: 'Кабінетне відбілювання системою ZOOM за один візит.',
    },
  ],
};

const DOCTORS: Array<
  Pick<Doctor, 'firstName' | 'lastName' | 'specialization' | 'description' | 'sortOrder'>
> = [
  {
    firstName: 'Олена',
    lastName: 'Коваль',
    specialization: 'Лікар-терапевт, гігієніст',
    description: '12 років практики, спеціалізується на естетичній реставрації.',
    sortOrder: 1,
  },
  {
    firstName: 'Андрій',
    lastName: 'Мельник',
    specialization: 'Хірург-імплантолог',
    description: 'Понад 1500 встановлених імплантів, навчання у Швейцарії.',
    sortOrder: 2,
  },
  {
    firstName: 'Ірина',
    lastName: 'Шевченко',
    specialization: 'Лікар-ортодонт',
    description: 'Брекет-системи та елайнери для дорослих і дітей.',
    sortOrder: 3,
  },
];

const ARTICLES: Array<Partial<Article>> = [
  {
    title: 'Як доглядати за зубами після імплантації',
    slug: 'dogliad-pislia-implantatsii',
    excerpt: 'Прості правила, які подовжать строк служби імпланта.',
    content:
      'Після імплантації важливо дотримуватися гігієни, уникати твердої їжі перші дні та відвідувати контрольні огляди.',
    metaTitle: 'Догляд після імплантації зубів — поради MIRAMONO',
    metaDescription: 'Покрокові рекомендації стоматолога щодо догляду за зубами після імплантації.',
    status: ArticleStatus.Published,
    translations: {
      en: {
        title: 'Caring for your teeth after implantation',
        excerpt: 'Simple rules that extend the lifespan of your implant.',
        content:
          'After implantation it is important to keep good hygiene, avoid hard food for the first days and attend follow-up checkups.',
      },
    },
  },
  {
    title: 'Чому варто робити професійну гігієну двічі на рік',
    slug: 'profesiina-hihiena-dvichi-na-rik',
    excerpt: 'Регулярна чистка запобігає карієсу та захворюванням ясен.',
    content:
      'Професійна гігієна видаляє зубний камінь і наліт, до яких не дістає щітка, та зберігає здоров’я ясен.',
    metaTitle: 'Професійна гігієна порожнини рота — MIRAMONO',
    metaDescription: 'Навіщо потрібна професійна чистка зубів і як часто її робити.',
    status: ArticleStatus.Published,
  },
];

const REVIEWS: Array<{ authorName: string; rating: number; text: string }> = [
  {
    authorName: 'Марія Т.',
    rating: 5,
    text: 'Найкраща клініка у Львові! Безболісно вилікували карієс, дуже уважний персонал.',
  },
  {
    authorName: 'Олександр П.',
    rating: 5,
    text: 'Встановив імплант — усе чітко, без болю, результат перевершив очікування.',
  },
  {
    authorName: 'Наталія К.',
    rating: 4,
    text: 'Поставили брекети доньці, лікар все детально пояснив. Рекомендую.',
  },
];

export async function seedDemoData(dataSource: DataSource): Promise<void> {
  const logger = new Logger('DemoSeed');
  let created = 0;

  const categories = dataSource.getRepository(ServiceCategory);
  const services = dataSource.getRepository(Service);
  for (const [slug, items] of Object.entries(SERVICES_BY_CATEGORY)) {
    const category = await categories.findOne({ where: { slug } });
    if (!category) {
      continue;
    }
    for (const item of items) {
      const exists = await services.exists({
        where: { name: item.name, categoryId: category.id },
        withDeleted: true,
      });
      if (exists) {
        continue;
      }
      await services.save(services.create({ ...item, categoryId: category.id }));
      created += 1;
    }
  }

  const doctors = dataSource.getRepository(Doctor);
  for (const data of DOCTORS) {
    const exists = await doctors.exists({
      where: { firstName: data.firstName, lastName: data.lastName },
      withDeleted: true,
    });
    if (exists) {
      continue;
    }
    await doctors.save(doctors.create(data));
    created += 1;
  }

  const articles = dataSource.getRepository(Article);
  for (const data of ARTICLES) {
    const exists = await articles.exists({ where: { slug: data.slug }, withDeleted: true });
    if (exists) {
      continue;
    }
    await articles.save(
      articles.create({
        ...data,
        publishedAt: data.status === ArticleStatus.Published ? new Date() : null,
      }),
    );
    created += 1;
  }

  const reviews = dataSource.getRepository(Review);
  for (const data of REVIEWS) {
    const exists = await reviews.exists({
      where: { authorName: data.authorName, text: data.text },
      withDeleted: true,
    });
    if (exists) {
      continue;
    }
    await reviews.save(reviews.create({ ...data, isPublished: true }));
    created += 1;
  }

  const gallery = dataSource.getRepository(GalleryCase);
  const galleryTitle = 'Естетична реставрація фронтальних зубів';
  if (!(await gallery.exists({ where: { title: galleryTitle }, withDeleted: true }))) {
    await gallery.save(
      gallery.create({
        title: galleryTitle,
        description: 'Композитна реставрація та відбілювання за один курс лікування.',
        beforeImageUrl: '/uploads/demo-before.jpg',
        afterImageUrl: '/uploads/demo-after.jpg',
        isPublished: true,
        sortOrder: 1,
      }),
    );
    created += 1;
  }

  logger.log(created > 0 ? `Seeded ${created} demo record(s)` : 'Demo data already present');
}
